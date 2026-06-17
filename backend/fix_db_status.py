import sqlite3

def fix_db():
    conn = sqlite3.connect('bhm_homs.db')
    c = conn.cursor()
    # If stage1 is APPROVED but overall is REJECTED, and stage2 is PENDING, then global should be PENDING_STAGE_2_AND_3
    c.execute("UPDATE requests SET status = 'PENDING_STAGE_2_AND_3' WHERE status = 'REJECTED' AND stage1_status = 'APPROVED' AND stage2_status = 'PENDING'")
    conn.commit()
    conn.close()
    print('Global statuses fixed!')

if __name__ == "__main__":
    fix_db()
